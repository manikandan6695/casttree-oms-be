interface Resolution {
  id: number;
  label: string;
}

interface File {
  id: number;
  magnetUri: string;
  resolution: Resolution;
  size: number;
  torrentUrl: string;
  torrentDownloadUrl: string;
  fileUrl: string;
  fileDownloadUrl: string;
  fps: number;
  width: number;
  height: number;
  metadataUrl: string;
}

interface Redundancy {
  baseUrl: string;
}

interface StreamingPlaylist {
  id: number;
  type: number;
  playlistUrl: string;
  segmentsSha256Url: string;
  files: File[];
  redundancies: Redundancy[];
}

export interface PeertubeVideoResponse {
  files: File[];
  streamingPlaylists: StreamingPlaylist[];
}
