import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
  EnhancedGenerateContentResponse,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import { environment } from '../environments/environment.development';

import { FileConversionService } from './file-conversion.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'ch-ui-studio';
  userPrompt = '';
  designPrompt = '';
  aiResponse = '';
  mockupUrl: string | null = null;
  codeGenerated: string | undefined;

  constructor(
    public http: HttpClient,
    private fileConversionService: FileConversionService
  ) {}

  ngOnInit(): void {
    // Google AI
    //this.TestGeminiPro('test');
    //this.TestGeminiProChat();
    //this.TestGeminiProVisionImages();
    // Vertex AI
    //this.TestGeminiProWithVertexAIViaREST();
  }

  async sendMessage() {
    if (!this.userPrompt) {
      return; // Handle empty input
    }

    await this.TestGeminiPro(this.userPrompt);
    
  }

  async clearMessage() {
    this.userPrompt = ''; // Clear input field
  }

  async TestGeminiPro(userPrompt: string) {
    // Gemini Client
    const genAI = new GoogleGenerativeAI(environment.API_KEY);
    const generationConfig = {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      maxOutputTokens: 100,
    };
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      ...generationConfig,
    });

    //const prompt = 'What is the largest number with a name?';
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    console.log(response.candidates?.[0].content.parts[0].text);
    console.log(userPrompt, response.text());
    this.aiResponse = response.text();
    return response;
  }

  async generateMockup() {
    if (!this.designPrompt) {
      return;
    }
    if (this.designPrompt.includes('phone')) {
      this.mockupUrl = 'assets/phone-numbers.jpeg';
    } else {
      this.mockupUrl = 'assets/save-cancel.jpeg';
    }
  }

  async TestGeminiProVisionImages(designPrompt: string) {
    try {
      let imageBase64 = await this.fileConversionService.convertToBase64(
        this.designPrompt.includes('phone')
          ? 'assets/phone-numbers.jpeg'
          : 'assets/save-cancel.jpeg'
      );

      // Check for successful conversion to Base64
      if (typeof imageBase64 !== 'string') {
        console.error('Image conversion to Base64 failed.');
        return;
      }

      // Gemini Client
      const genAI = new GoogleGenerativeAI(environment.API_KEY);
      const generationConfig = {
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
        maxOutputTokens: 100,
      };
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro-vision',
        ...generationConfig,
      });

      let prompt = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          text: 'Provide html code',
        },
      ];

      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(response.candidates?.[0].content.parts[0].text);
      this.codeGenerated = response.candidates?.[0].content.parts[0].text;
      console.log(response);
    } catch (error) {
      console.error('Error converting file to Base64', error);
    }
  }
}
