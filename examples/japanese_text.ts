import { FuzzySearch } from "../mod.ts";

interface Article {
  title: string;
}

const articles: Article[] = [
  { title: "東京タワー" },
  { title: "東京スカイツリー" },
  { title: "大阪城" },
];

const search = new FuzzySearch<Article>(["title"]);
search.addAll(articles);

const results = search.search("東京", { threshold: 0.5 });

console.log("Search results for '東京':");
console.log(results);
// Finds both "東京タワー" and "東京スカイツリー"
