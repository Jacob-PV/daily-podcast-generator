export interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
}

export interface PodcastGenerationRequest {
  topics: string[];
}

export interface PodcastGenerationResponse {
  audioBase64: string;
  script: string;
  title: string;
  duration: number;
}

export interface GenerationStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}
