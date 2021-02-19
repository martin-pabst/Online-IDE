import { Repository } from "../../communication/Data.js";

export class RepositoryTool {

    static deserializeRepository(repo: Repository) {

        if (repo.files != null && repo.files.startsWith('[')) {
            repo.fileEntries = JSON.parse(repo.files);
        } else {
            repo.fileEntries = [];
        }

        repo.fileEntries.forEach(fe => fe.text = fe.text.replace(/\r\n/g, "\n"));

        if (!repo.history.endsWith("]")) repo.history += "]";
        repo.historyEntries = JSON.parse(repo.history);

    }

    static copyRepository(repo: Repository, withHistoryElements: boolean): Repository {

        let crepo: Repository = Object.assign({}, repo);

        if (repo.fileEntries != null) {
            crepo.fileEntries = [];
            for (let fe of repo.fileEntries) {
                crepo.fileEntries.push(Object.assign({}, fe));
            }
        }

        if (repo.historyEntries != null && withHistoryElements) {
            crepo.historyEntries = [];
            for (let he of repo.historyEntries) {
                let che = Object.assign({}, he);

                if (he.historyFiles != null) {
                    che.historyFiles = [];
                    for (let hfe of he.historyFiles) {
                        che.historyFiles.push(Object.assign({}, hfe));
                    }
                }

                crepo.historyEntries.push(che);
            }
        }

        return crepo;

    }

    
}