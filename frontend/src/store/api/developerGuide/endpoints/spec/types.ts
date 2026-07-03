export interface IFetchSpecOptions {
    include?: string[];
    usecase?: string;
    flowId?: string;
    tag?: string;
    docSlug?: string;
}

export interface IGetSpecParams extends IFetchSpecOptions {
    domain: string;
    version: string;
}
