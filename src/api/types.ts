/** Contract types from the RealWorld API spec. */

export interface User {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface NewArticle {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export interface ValidationErrors {
  errors: Record<string, string[]>;
}
