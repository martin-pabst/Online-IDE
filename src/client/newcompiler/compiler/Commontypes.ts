
export type TextPosition = {
    line: number,
    column: number, 
    length: number
}

export type TextPositionWithoutLength = {
    line: number,
    column: number
}

// maps module to textposition
export type UsagePositions = Map<any, TextPosition[]>;

export type TextPositionWithModule = {
    module: any,
    position: TextPosition,
    monacoModel?: monaco.editor.ITextModel
}

export type QuickFix = {
    title: string,
    editsProvider: (uri: monaco.Uri) => monaco.languages.WorkspaceTextEdit[]
}

export type ErrorLevel = "info" | "error" | "warning";

export type Error = {
    position: TextPosition,
    text: string,
    quickFix?: QuickFix,
    level: ErrorLevel
}
