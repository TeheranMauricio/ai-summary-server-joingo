/**
 * @fileoverview Templates for AI prompts used in meeting summarization
 * @module utils/prompt-templates
 */

import { MeetingData } from '../types/meeting.types';

/**
 * Utility class for generating AI prompts
 * Contains template methods for creating structured prompts for Claude AI
 * @class PromptTemplates
 */
export class PromptTemplates {
  /**
   * Generates a comprehensive prompt for meeting summary generation
   * Creates a detailed prompt with meeting context and JSON schema requirements
   * @param {MeetingData} data - Complete meeting data including transcriptions and messages
   * @returns {string} Formatted prompt for Claude API
   * @static
   */
  static generateSummaryPrompt(data: MeetingData): string {
    const participantsList = data.participants
      .map(p => `- ${p.name}`)
      .join('\n');

    const transcriptions = data.transcriptions
      .map(t => `[${new Date(t.timestamp).toLocaleTimeString('es-CO')}] ${t.userName}: ${t.text}`)
      .join('\n');

    const chatMessages = data.chatMessages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString('es-CO')}] ${m.userName}: ${m.message}`)
      .join('\n');

    const duration = this.calculateDuration(data.startTime, data.endTime);

    return `
Eres un asistente experto en generar resúmenes profesionales de reuniones. Analiza la siguiente información de una reunión de JoinGo:

📅 INFORMACIÓN DE LA REUNIÓN:
- ID de reunión: ${data.meetingId}
- Duración: ${duration}
- Inicio: ${new Date(data.startTime).toLocaleString('es-CO')}
${data.endTime ? `- Fin: ${new Date(data.endTime).toLocaleString('es-CO')}` : ''}

👥 PARTICIPANTES:
${participantsList}

🎙️ TRANSCRIPCIONES DE VOZ:
${transcriptions || 'No hay transcripciones de voz disponibles'}

💬 MENSAJES DE CHAT:
${chatMessages || 'No hay mensajes de chat'}

INSTRUCCIONES:
Genera un resumen estructurado y profesional en español. Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:

{
  "summary": "Resumen ejecutivo de 2-3 párrafos sobre los temas principales discutidos",
  "participants": [
    {
      "name": "Nombre del participante",
      "contributions": "Resumen breve de sus aportes y participación"
    }
  ],
  "topics": [
    "Tema principal 1",
    "Tema principal 2",
    "Tema principal 3"
  ],
  "tasks": [
    {
      "description": "Descripción clara de la tarea",
      "assignee": "Nombre de la persona responsable",
      "deadline": "Fecha límite si se mencionó (formato: YYYY-MM-DD)"
    }
  ],
  "nextSteps": [
    "Próximo paso 1",
    "Próximo paso 2"
  ]
}

REGLAS IMPORTANTES:
1. Si no hay suficiente información para una sección, usa un array vacío [] o un string breve
2. Sé específico en las tareas: incluye contexto y responsable cuando esté claro
3. Los temas deben ser concisos (máximo 10 palabras cada uno)
4. El resumen debe ser objetivo y profesional
5. Si no se identifican tareas explícitas, el array "tasks" debe estar vacío
6. NO incluyas ningún texto fuera del JSON
7. NO uses comillas triples ni markdown, solo el JSON puro

Responde ahora con el JSON:`;
  }

  /**
   * Calculates human-readable meeting duration
   * @param {string} startTime - ISO timestamp of meeting start
   * @param {string} [endTime] - ISO timestamp of meeting end
   * @returns {string} Formatted duration string (e.g., "45 minutos", "1h 30min")
   * @private
   * @static
   */
  private static calculateDuration(startTime: string, endTime?: string): string {
    if (!endTime) return 'En curso';

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
}
