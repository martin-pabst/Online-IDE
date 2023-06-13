import { SerializedClassDiagram } from "../main/gui/diagrams/classdiagram/ClassDiagram.js"


export type UserSettings = {
    helperHistory: {
        newWorkspaceHelperDone: boolean,
        newFileHelperDone: boolean,
        speedControlHelperDone: boolean,
        consoleHelperDone: boolean,
        homeButtonHelperDone: boolean,
        stepButtonHelperDone: boolean,
        repositoryButtonDone: boolean,
        folderButtonDone: boolean
    },
    //    theme: string,  // old!
    viewModes: ViewModes,
    classDiagram: SerializedClassDiagram
}

export type ViewModes = {
    presentation: ViewMode;
    monitor: ViewMode;
    viewModeChosen: "presentation" | "monitor"
}

export type ViewMode = {
    theme: string;
    fontSize: number;
    highContrast: boolean;
}


export type WorkspaceSettings = {
    libraries: string[]
}

export type FileData = {
    name: string,
    id: number,
    text: string,
    text_before_revision: string,
    submitted_date: string,
    student_edited_after_revision: boolean,
    version: number,
    workspace_id: number,
    forceUpdate: boolean,
    is_copy_of_id?: number,
    repository_file_version?: number,
    identical_to_repository_version: boolean
}

export type WorkspaceData = {
    name: string,
    path: string,
    isFolder: boolean,
    id: number,
    owner_id: number,
    files: FileData[],
    currentFileId: number,
    settings?: string,       // serialized WorkspaceSettings

    version: number,
    repository_id: number,    // id of repository-workspace
    has_write_permission_to_repository: boolean, // true if owner of this working copy has write permission to repository workspace

    pruefungId: number,
    readonly: boolean,

    spritesheetId: number
}

export type Workspaces = {
    workspaces: WorkspaceData[]
}


export type UserData = {
    id: number,
    klasse_id: number,
    schule_id: number,
    is_teacher: boolean,
    is_admin: boolean,
    is_schooladmin: boolean,
    username: string,
    familienname: string,
    rufname: string,
    currentWorkspace_id?: number,
    settings?: UserSettings,
    password?: string,
    is_testuser?: boolean
}

export type GetUserDataRequest = {

}

export type GetUserDataResponse = {
    success: boolean,
    user: UserData,
    classdata: ClassData[], // null if !is_teacher
    schoolName: string
}

export type GetSchoolDataRequest = {
    school_id: number
}

export type GetSchoolDataResponse = {
    success: boolean,
    schoolData?: SchoolData[]
}

export type GetClassesDataRequest = {
    school_id: number
}

export type GetClassesDataResponse = {
    success: boolean,
    classDataList: ClassData[]
}

export type GetTeacherDataRequest = {
    school_id: number
}

export type GetTeacherDataResponse = {
    success: boolean,
    teacherData?: TeacherData[]
}

export type ClassData = {
    id: number,
    lehrkraft_id: number,
    zweitlehrkraft_id: number,
    schule_id: number,
    name: string,
    aktiv: boolean,
    students: UserData[],
    text?: string
}

export type SchoolData = {
    id: number,
    name: string,
    kuerzel: string,
    classes: ClassData[]
    usersWithoutClass: UserData[]
}

export type TeacherData = {
    userData: UserData,
    classes: ClassData[]
}

export type LoginRequest = {
    username: string,
    password: string
}

export type TicketLoginRequest = {
    ticket: string
}

export type LoginResponse = {
    success: boolean,
    user: UserData,
    classdata: ClassData[], // null if !is_teacher
    workspaces: Workspaces,
    isTestuser: boolean,
    activePruefung: Pruefung
}

export type LogoutRequest = {
    currentWorkspaceId: number
}

export type LogoutResponse = {
    success: boolean
}

export type SendUpdatesRequest = {
    workspacesWithoutFiles: WorkspaceData[],
    files: FileData[],
    owner_id: number,
    userId: number,
    currentWorkspaceId: number,
    getModifiedWorkspaces: boolean
}

export type SendUpdatesResponse = {
    success: boolean,
    workspaces: Workspaces,
    filesToForceUpdate: FileData[],
    activePruefung: Pruefung
}

export type UpdateUserSettingsRequest = {
    settings: UserSettings,
    userId: number
}

export type UpdateUserSettingsResponse = {
    success: boolean;

}


export type CreateOrDeleteFileOrWorkspaceRequest = {
    entity: "workspace" | "file",
    type: "create" | "delete",
    data?: WorkspaceData | FileData, // in case of create
    id?: number, // in case of delete
    owner_id?: number, // in case of create
    userId: number
}

export type CRUDResponse = {
    success: boolean,
    id?: number, // in case of create
    error: string
}

export type CRUDUserRequest = {
    type: "create" | "update" | "delete",
    data?: UserData, // for create and update
    ids?: number[], // for delete
}

export type CRUDClassRequest = {
    type: "create" | "update" | "delete",
    data?: ClassData, // for create and update
    ids?: number[], // for delete
}

export type CRUDSchoolRequest = {
    type: "create" | "update" | "delete",
    data?: SchoolData, // for create and update
    id?: number, // for delete
}

export type BulkCreateUsersRequest = {
    onlyCheckUsernames: boolean,
    users: UserData[],
    schule_id: number
}

export type BulkCreateUsersResponse = {
    success: boolean,
    namesAlreadyUsed: string[],
    message: string
}

export type GetWorkspacesRequest = {
    ws_userId: number,
    userId: number
}

export type GetWorkspacesResponse = {
    success: boolean,
    workspaces: Workspaces
}

export type ChangeClassOfStudentsRequest = {
    student_ids: number[],
    new_class_id: number
}

export type ChangeClassOfStudentsResponse = {
    success: boolean,
    message: string
}


/**
 * Copies Workspace and returns copy.
 */
export type DuplicateWorkspaceRequest = {
    workspace_id: number // Workspace to copy
}

export type DuplicateWorkspaceResponse = {
    workspace: WorkspaceData, // new Workspace (with copied files)
    message: string
}

/**
 * Creates Repository and links it with given workspace
 */
export type CreateRepositoryRequest = {
    workspace_id: number, // Workspace to copy
    publish_to: number // 0 == private, 1 == class, 2 == school
}

export type CreateRepositoryResponse = {
    message: string
}

export type DeleteRepositoryRequest = {
    repository_id: number
}

export type DeleteRepositoryResponse = { success: boolean, message?: string };


/**
 * Distributes given workspace to all students in given class
 */
export type DistributeWorkspaceRequest = {
    workspace_id: number, // Workspace to copy
    class_id: number,
    student_ids: number[]
}

export type DistributeWorkspaceResponse = {
    message: string
}

export type SetRepositorySecretRequest = {
    repository_id: number,
    newSecretRead: boolean,
    newSecretWrite: boolean
}

export type SetRepositorySecretResponse = {
    success: boolean,
    message: string,
    secret_read: string,
    secret_write: string
}

export type GetStatisticsRequest = {
    now: boolean
}

export type StatisticData = {
    users: number,
    memory: number,
    time: string,
    requestsPerMinute: number,
    userlist?: string[],
    webSocketSessionCount: number,
    webSocketClientCount: number,
    webSocketRequestPerSecond: number,
    performanceDataList: PerformanceData[]
}

export type PerformanceData = {
    url: string;
    sumTime: number;
    count: number;
}

export type CollectPerformanceDataRequest = {
    data: PerformanceData[]
}

export type GetStatisticsResponse = {
    success: boolean,
    statisticPeriodSeconds: number,
    data: StatisticData[]
}

export type RepositoryFileEntry = {
    id: number,
    version: number,
    filename: string,
    text: string
}

export type RepositoryHistoryFileEntry = {
    id: number,
    version: number,
    type: "change" | "create" | "delete" | "intermediate",
    filename?: string, // if type == "create" || type == "intermediate" || type == "change" and filename has changed
    content?: string, // if type == "create" || type == "intermediate"
    changeSet?: string // if "change" and not only filename has changed
}

export type RepositoryHistoryEntry = {
    timestamp: string,
    version: number,
    userId: number,
    username: string,
    name: string,
    comment: string,
    isIntermediateEntry: boolean, // true, if entry contains complete code of all files
    historyFiles: RepositoryHistoryFileEntry[]
}


export type Repository = {
    id: number,
    name: string,
    owner_id: number,
    schule_id: number,
    files: string,

    fileEntries?: RepositoryFileEntry[], // deserialized field files

    history: string,

    historyEntries?: RepositoryHistoryEntry[],

    version: number,
    published_to: number,
    description: string,

    secret_read?: string,
    secret_write?: string,

    spritesheetId: number

}


export type GetRepositoryRequest = {
    repository_id: number,
    workspace_id: number
}

export type GetRepositoryResponse = {
    success: boolean,
    message: string,
    repository: Repository
}

export type CommitFilesRequest = {
    repository_id: number,
    workspace_id: number,
    repositoryHistoryEntry: RepositoryHistoryEntry,
    files: RepositoryFileEntry[], // current state of workspace files
    repositoryVersionBeforeCommit: number,
    newlyVersionedFileIds: number[]
}

export type CommitFilesResponse = {
    success: boolean,
    message: string,
    repositoryOutOfSync: boolean,
    repository: Repository
};

export type RepositoryUser = {
    user_id: number,
    username: string,
    firstName: string,
    lastName: string,
    klasse: string,
    canWrite: boolean
}

export type GetRepositoryUserListRequest = {
    repository_id: number
}

export type GetRepositoryUserListResponse = {
    success: boolean,
    message: string,
    repositoryUserList: RepositoryUser[]
}

export type RepositoryInfo = {
    id: number,
    name: string,
    owner_id: number,
    owner_name: string,
    owner_username: string,
    schule_id: number,
    klasse_id: number,
    version: number,
    published_to: number,
    description: string,
    secret_read?: string,
    secret_write?: string
}

export type GetRepositoryListRequest = {
    onlyOwnRepositories: boolean
}

export type GetRepositoryListResponse = {
    success: boolean,
    message: string,
    repositories: RepositoryInfo[]
}

export type UpdateRepositoryRequest = {
    repository_id: number,
    owner_id: number,
    // published_to 0: none; 1: class; 2: school; 3: all
    published_to: number,
    description: string,
    name: string
}

export type UpdateRepositoryResponse = {
    success: boolean,
    message: string
}

export type AttachWorkspaceToRepositoryRequest = {
    createNewWorkspace: boolean,
    workspace_id?: number,
    repository_id: number,
    secret?: string
}

export type AttachWorkspaceToRepositoryResponse = { message?: string, new_workspace?: WorkspaceData };

export type RepositoryUserWriteAccessData = {
    user_id: number,
    has_write_access: boolean
}

export type UpdateRepositoryUserWriteAccessRequest = {
    repository_id: number,
    writeAccessList: RepositoryUserWriteAccessData[]
}

export type UpdateRepositoryUserWriteAccessResponse = { success: boolean, message: string }

export type GainRepositoryLockRequest = { repository_id: number }

export type GainRepositoryLockResponse = { success: boolean, message: string }

export type LeaseRepositoryLockRequest = { repository_id: number }

export type LeaseRepositoryLockResponse = { success: boolean, message: string }



// WebSocket

export type GetWebSocketTokenResponse = { success: boolean, token?: string }

export type WebSocketRequestConnect = {
    command: 1,
    token: string,
    nickname: string,
    sessionCode: string
}

export type WebSocketRequestSendToAll = {
    command: 2,
    data: string,
    dataType: string
}

export type WebSocketRequestSendToClient = {
    command: 3,
    recipient_id: number,
    data: string,
    dataType: string
}

export type WebSocketRequestDisconnect = {
    command: 4
}

export type WebSocketRequestKeepAlive = {
    command: 5
}

export type WebSocketRequestFindPairing = {
    command: 6,
    count: number,
    nicknames: string[]
}

export type WebSocketResponse = WebSocketResponseMessage | WebSocketResponseNewClient |
    WebSocketResponseOtherClientDisconnected | WebSocketResponseSynchro | WebSocketResponseKeepAlive |
    WebSocketResponsePairingFound;

export type WebSocketResponseNewClient = {
    command: 1,
    user_id: number,
    rufname: string,
    familienname: string,
    username: string,
    nickname: string
}

export type WebSocketResponseMessage = {
    command: 2,
    from_client_id: number,
    data: string,
    dataType: string
}

export type WebSocketResponseOtherClientDisconnected = {
    command: 3,
    disconnecting_client_id: number
}

export type WebSocketResponseSynchro = {
    command: 4,
    currentTimeMills: number,
    client_id: number
}

export type WebSocketResponseKeepAlive = {
    command: 5
}

export type PairingClient = {
    id: number,
    index: number
}

export type WebSocketResponsePairingFound = {
    command: 6,
    clients: PairingClient[]
}

export type GetMessagesRequest = {
    type: string;
}

export type Message = {
    text: string,
    type: string,
    done: boolean,
    time: number,
    user_id: number
}

export type GetMessagesResponse = {
    success: boolean;
    messages: Message[];
}

export type ImportSchoolsResponse = {
    success: boolean,
    messageType: string
}

/**
 * Database
 */

export type GetTemplateRequest = {
    token: string
}


export type DatabaseData = {
    id: number,
    name: string,
    based_on_template_id: number,
    templateDump: Uint8Array,
    statements: string[],
    description: string,
}

export type ObtainSqlTokenRequest = {
    code: string
}

export type ObtainSqlTokenResponse = {
    success: boolean,
    token: string,
    message: string
}

export type GetDatabaseRequest = {
    token: string
}

export type getDatabaseResponse = {
    success: boolean,
    database: DatabaseData,
    version: number,
    error: string
}

/**
 * Database WebSocket
 */

export type JAddStatementRequest = {
    token: string,
    version_before: number,
    statements: string[]
}

export type JAddStatementResponse = {
    success: boolean,
    statements_before: string[],
    new_version: number,
    message: string
}

export type JRollbackStatementRequest = {
    token: string,
    current_version: number
}

export type JRollbackStatementResponse = {
    success: boolean,
    message: string
}

/**
 * Messages from client to server
 */
export type JWebSocketMessageConnect = {
    command: number; // == 1
    token: string; // when "connect"
    databaseVersion: number; // when "getStatements" or "connect"
}

export type JWebSocketMessageGetStatements = {
    command: number;
    // 1 == "connect", 2 == "getStatements",
    databaseVersion: number; // when "getStatements" or "connect"
}

export type JWebSocketMessageExecuteStatement = {
    command: number;
    // 3 == "executeStatement"
    version_before: number; // when "executeStatement"
    statements: string[]; // when "executeStatement"
}

export type JWebSocketMessageDisconnect = {
    command: number;
    // 4 == "disconnect" 5 == "keepalive"
}

export type JWebSocketMessageKeepalive = {
    command: number;
    // 4 == "disconnect" 5 == "keepalive"
}


/**
 * Messages from server
 */
export type JMessageFromServer = SendingStatementsMessageFromServer | DisconnectMessageFromServer | KeepAliveMessageFromServer;

export type SendingStatementsMessageFromServer = {
    command: number; // == 2,
    firstNewStatementIndex: number,
    newStatements: string[]
}

export type DisconnectMessageFromServer = {
    command: number; // == 3
}

export type KeepAliveMessageFromServer = {
    command: number; // == 4
}


/**
 * Long polling database listener
 */
export type DatabaseLongPollingListenerRequest = {
    token: string,
    listenerIdentifier: number
}

export type LongPollingListenerResponse = {
    success: boolean,
    message: string,
    firstNewStatementIndex: number,
    newStatements: string[],
    rollbackToVersion: number
}

export type UploadSpriteResponse = {
    success: boolean,
    message: string,
    spriteFileId: number
}

export type PruefungState = "preparing" | "running" | "correcting" | "opening";
export var PruefungCaptions: {[index: string]: string} = {
    "preparing": "Vorbereitung",
    "running": "Pr. läuft!",
    "correcting": "Korrektur",
    "opening": "Herausgabe"
}

export type Pruefung = {
    id: number,
    name: string,
    klasse_id: number,
    template_workspace_id: number,
    state: PruefungState;
}

export type CRUDPruefungRequest = {
    pruefung?: Pruefung,
    requestType: "create" | "update" | "delete"
}

export type CRUDPruefungResponse = {
    success: boolean,
    newPruefungWithIds?: Pruefung,
    message: string
}



export type StudentPruefungStateInfo = {
    timestamp: number,
    state: string,
    running: boolean
} 

export type GetPruefungStudentStatesRequest = {
    pruefungId: number
}

export type GetPruefungStudentStatesResponse = {
    success: boolean,
    pruefungState: string,
    pruefungStudentStates: {[id: number]: StudentPruefungStateInfo},
    message: string
}


// data class ReportPruefungStudentStateRequest(var pruefungId: Int, var clientState: String);
// data class ReportPruefungStudentStateResponse(var success: Boolean, var pruefungState: String, var message: String);

export type ReportPruefungStudentStateRequest = {
    pruefungId: number,
    clientState: String,
    running: Boolean
}

export type ReportPruefungStudentStateResponse = {
    success: boolean,
    pruefungState: string,
    message: string
}