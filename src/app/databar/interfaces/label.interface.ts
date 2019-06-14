export interface Label {
    start: number;
    end: number;
    label: number;
    type?: string;
    selected?: boolean;
    id?: number;
}

export interface TypeMap {
    [index: number]: string;
}

export type LabelKey = string |number
