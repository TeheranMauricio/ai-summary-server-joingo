/**
 * @fileoverview Service for generating AI-powered meeting summaries using Claude
 * @module services/summarizer
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { Logger } from '../utils/logger';
import { PromptTemplates } from '../utils/prompt-templates';
import { MeetingData, Summary } from '../types/meeting.types';

/**
 * Service for generating meeting summaries using Anthropic's Claude AI
 * @class SummarizerService
 */
export class SummarizerService {
  /** Anthropic client instance */
  private anthropic: Anthropic;

  /**
   * Creates an instance of SummarizerService
   * Initializes Anthropic client with API credentials
   */
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey
    });
  }

  /**
   * Generates a complete meeting summary using Claude AI
   * Creates a structured summary with topics, tasks, and next steps
   * @param {MeetingData} meetingData - Complete meeting data including transcriptions and messages
   * @returns {Promise<Summary>} AI-generated structured summary
   * @throws {Error} If summary generation fails
   */
  async generateSummary(meetingData: MeetingData): Promise<Summary> {
    try {
      Logger.info(`Generating summary for meeting: ${meetingData.meetingId}`);

      // Build the prompt
      const prompt = PromptTemplates.generateSummaryPrompt(meetingData);

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Extract text from response
      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.type === 'text' ? block.text : '')
        .join('');

      Logger.debug(`Claude response: ${responseText.substring(0, 100)}...`);

      // Parse the JSON response
      const summary = this.parseClaudeResponse(responseText, meetingData);

      Logger.success(`Summary generated successfully for ${meetingData.meetingId}`);

      return summary;
    } catch (error: any) {
      Logger.error('Summary generation failed', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Parses Claude's response and creates a Summary object
   * Handles JSON extraction and provides fallback if parsing fails
   * @param {string} responseText - Raw response text from Claude
   * @param {MeetingData} meetingData - Original meeting data for fallback
   * @returns {Summary} Parsed summary object
   * @private
   */
  private parseClaudeResponse(responseText: string, meetingData: MeetingData): Summary {
    try {
      // Clean the response (remove possible markdown code blocks)
      let cleanedText = responseText.trim();

      // Remove ```json and ``` if they exist
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Attempt to parse JSON
      const parsed = JSON.parse(cleanedText);

      // Calculate duration
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

      // Fallback: create a basic summary
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
   * Calculates meeting duration in human-readable format
   * @param {string} startTime - ISO timestamp of meeting start
   * @param {string} [endTime] - ISO timestamp of meeting end
   * @returns {string} Formatted duration (e.g., "45 minutos", "1h 30min")
   * @private
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
   * Generates a quick, brief summary (maximum 3 lines)
   * Useful for quick previews without full processing
   * @param {MeetingData} meetingData - Meeting data to summarize
   * @returns {Promise<string>} Brief text summary
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
