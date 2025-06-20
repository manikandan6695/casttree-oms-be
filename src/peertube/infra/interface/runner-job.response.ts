interface State {
  id: number;
  label: string;
}

interface Input {
  videoFileUrl: string;
}

interface Output {
  fps: number;
  resolution: number;
}

interface Payload {
  input: Input;
  output: Output;
}

interface ParentState {
  id: number;
  label: string;
}

interface Parent {
  id: number;
  uuid: string;
  type: string;
  state: ParentState;
}

interface PrivatePayload {
  videoUUID: string;
  isNewVideo: boolean;
  deleteWebVideoFiles: boolean;
}

interface DataItem {
  uuid: string;
  type: string;
  state: State;
  progress: number | null;
  priority: number;
  failures: number;
  error: string | null;
  payload: Payload;
  createdAt: string;
  updatedAt: string;
  parent: Parent;
  runner: string | null;
  privatePayload: PrivatePayload;
}

export interface DataResponse {
  total: number;
  data: DataItem[];
}
