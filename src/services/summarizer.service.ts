import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { Logger } from '../utils/logger';
import { PromptTemplates } from '../utils/prompt-templates';
import { MeetingData, Summary } from '../types/meeting.types';

export class SummarizerService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey
    });
  }

  /**
   * Genera un resumen completo de la reunión usando Claude
   */
  async generateSummary(meetingData: MeetingData): Promise<Summary> {
    try {
      Logger.info(`Generating summary for meeting: ${meetingData.meetingId}`);
      
      // Construir el prompt
      const prompt = PromptTemplates.generateSummaryPrompt(meetingData);
      
      // Llamar a Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Extraer el texto de la respuesta
      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.type === 'text' ? block.text : '')
        .join('');

      Logger.debug(`Claude response: ${responseText.substring(0, 100)}...`);

      // Parsear el JSON
      const summary = this.parseClaudeResponse(responseText, meetingData);
      
      Logger.success(`Summary generated successfully for ${meetingData.meetingId}`);
      
      return summary;
    } catch (error: any) {
      Logger.error('Summary generation failed', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Parsea la respuesta de Claude y crea el objeto Summary
   */
  private parseClaudeResponse(responseText: string, meetingData: MeetingData): Summary {
    try {
      // Limpiar la respuesta (remover posibles markdown code blocks)
      let cleanedText = responseText.trim();
      
      // Remover ```json y ``` si existen
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Intentar parsear el JSON
      const parsed = JSON.parse(cleanedText);
      
      // Calcular duración
      const duration = this.calculateDuration(
        meetingData.startTime, 
        meetingData.endTime
      );
      
      return {
        summary: parsed.summary || 'No se pudo generar un resumen.',
        participants: parsed.participants || [],
        topics: parsed.topics || [],
        tasks: parsed.tasks || [],
        nextSteps: parsed.nextSteps || [],
        generatedAt: new Date().toISOString(),
        meetingDuration: duration
      };
    } catch (error) {
      Logger.error('Failed to parse Claude response as JSON', error);
      
      // Fallback: crear un resumen básico
      return {
        summary: responseText.substring(0, 500) + '...',
        participants: meetingData.participants.map(p => ({
          name: p.name,
          contributions: 'Participó en la reunión'
        })),
        topics: ['Información de la reunión procesada'],
        tasks: [],
        nextSteps: ['Revisar el contenido de la reunión'],
        generatedAt: new Date().toISOString(),
        meetingDuration: this.calculateDuration(
          meetingData.startTime,
          meetingData.endTime
        )
      };
    }
  }

  /**
   * Calcula la duración de la reunión
   */
  private calculateDuration(startTime: string, endTime?: string): string {
    if (!endTime) return 'Duración no disponible';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutos`;
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  }

  /**
   * Genera un resumen rápido (sin formato completo)
   */
  async generateQuickSummary(meetingData: MeetingData): Promise<string> {
    try {
      const prompt = `
Genera un resumen muy breve (máximo 3 líneas) de esta reunión:

Participantes: ${meetingData.participants.map(p => p.name).join(', ')}
Transcripciones: ${meetingData.transcriptions.length} intervenciones
Chat: ${meetingData.chatMessages.length} mensajes

Responde solo con el resumen, sin formato:`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.type === 'text' ? block.text : '')
        .join('');

      return text.trim();
    } catch (error) {
      Logger.error('Quick summary generation failed', error);
      return 'No se pudo generar un resumen rápido.';
    }
  }
}