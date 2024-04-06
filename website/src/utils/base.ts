// @ts-ignore
import project from 'virtual:starlight/project-context';

export const BASE_PATH = import.meta.url;
// console.log(BASE_PATH);


export function projectRelativeUrl(relativePath: string | URL): URL {
    return new URL(relativePath, project.root);
}