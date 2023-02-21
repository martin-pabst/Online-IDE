export function compareWithPath(name1: string, path1: string[], isFolder1: boolean, name2: string, path2: string[], isFolder2: boolean) {

    path1 = path1.slice();
    path1.push(name1);
    name1 = "";

    path2 = path2.slice();
    path2.push(name2);
    name2 = "";

    let i = 0;
    while (i < path1.length && i < path2.length) {
        let cmp = path1[i].localeCompare(path2[i]);
        if (cmp != 0) return cmp;
        i++;
    }

    if (path1.length < path2.length) return -1;
    if (path1.length > path2.length) return 1;

    return name1.localeCompare(name2);
}

console.log(compareWithPath("sest", ['a', 'b', 'c'], false, "tigi", ['a', 'b', 'c', 'sest'], false));