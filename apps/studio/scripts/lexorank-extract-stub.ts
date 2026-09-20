// Stand-in for lexorank during schema extraction only; see sanity.cli.ts.
export class LexoRank {
  static min() {
    return new LexoRank();
  }
  static middle() {
    return new LexoRank();
  }
  static parse() {
    return new LexoRank();
  }
  genNext() {
    return new LexoRank();
  }
  genPrev() {
    return new LexoRank();
  }
  between() {
    return new LexoRank();
  }
  toString() {
    return "0|hzzzzz:";
  }
}
