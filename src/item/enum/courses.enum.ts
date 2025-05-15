export enum EcomponentType {
  ColThumbnailList = "2ColThumbnailList",
  ActiveProcessList = "ActiveProcessList",
  feature = "feature-carousel",
}

export const EScomponentType = [
  EcomponentType.ColThumbnailList,
  EcomponentType.ActiveProcessList,
  EcomponentType.feature,
];

export enum Eheader {
  casttreeSpecials = "CASTTREE SPECIALS",
  continue = "Continue where you left",
  mySeries = "Series for you",
  allSeries = "All Series",
  upcoming = "Coming Soon",
  trendingSeries = "Trending Series",
  mostWatched = "Most Watched",
  dailyVocalExcercises = "Daily Vocal Exercises",
  stageAndMic = "Stage and Mic",
  forYourVoice = "For Your Voice",
}

export const ESheader = [
  Eheader.casttreeSpecials,
  Eheader.continue,
  Eheader.mySeries,
  Eheader.upcoming,
];

export enum Etag {
  SeriesForYou = "SeriesForYou",
  featured = "featured",
  upcoming = "upcomingseries",
}

export const EStag = [Etag.SeriesForYou, Etag.featured, Etag.upcoming];
