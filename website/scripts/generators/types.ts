export interface Thematic {
  title: string;
  description: string;
  url: string;
}

export interface MainPage {
  title: string;
  url: string;
  thematics: Thematic[];
}

export interface ContentPage {
  title: string;
  thematicTitle: string;
  ficheTitle: string;
  subPageTitle: string;
  url: string;
  markdown: string;
  questions?: Question[];
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CrawlerData {
  mainPage: MainPage;
  contentPages: ContentPage[];
}
