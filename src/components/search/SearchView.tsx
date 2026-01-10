import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";

export function SearchView() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SearchBar />
      <SearchResults />
    </div>
  );
}
