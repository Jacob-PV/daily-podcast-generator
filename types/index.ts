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

export interface StorySource {
  title: string;
  url: string;
}

export interface PodcastStory {
  title: string;
  content: string;
  sources: StorySource[];
}

export interface PodcastGenerationResponse {
  audioBase64: string;
  title: string;
  duration: number;
  intro: string;
  stories: PodcastStory[];
  outro: string;
}

export interface GenerationStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}
