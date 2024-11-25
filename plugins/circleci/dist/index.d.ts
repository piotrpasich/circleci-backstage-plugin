/// <reference types="react" />
import * as react from 'react';
import react__default from 'react';
import * as _backstage_core_plugin_api from '@backstage/core-plugin-api';
import { DiscoveryApi } from '@backstage/core-plugin-api';
import * as circleci_api from 'circleci-api';
import { CircleCIOptions, BuildSummary, BuildWithSteps } from 'circleci-api';
export { BuildStepAction, BuildSummary, BuildWithSteps, GitType } from 'circleci-api';
import { Entity } from '@backstage/catalog-model';

/** @public */
declare const circleCIPlugin: _backstage_core_plugin_api.BackstagePlugin<{}, {}, {}>;
/** @public */
declare const EntityCircleCIContent: () => react.JSX.Element;

/** @public */
declare const circleCIApiRef: _backstage_core_plugin_api.ApiRef<CircleCIApi>;
/** @public */
declare class CircleCIApi {
    private readonly discoveryApi;
    private readonly proxyPath;
    constructor(options: {
        discoveryApi: DiscoveryApi;
        /**
         * Path to use for requests via the proxy, defaults to /circleci/api
         */
        proxyPath?: string;
    });
    retry(buildNumber: number, options: Partial<CircleCIOptions>): Promise<BuildSummary>;
    getBuilds(pagination: {
        limit: number;
        offset: number;
    }, options: Partial<CircleCIOptions>): Promise<circleci_api.BuildSummaryResponse>;
    getUser(options: Partial<CircleCIOptions>): Promise<circleci_api.Me>;
    getBuild(buildNumber: number, options: Partial<CircleCIOptions>): Promise<BuildWithSteps>;
    getUrl(url: string): Promise<unknown>;
    private getApiUrl;
}

/** @public */
declare const circleCIRouteRef: _backstage_core_plugin_api.RouteRef<undefined>;
/** @public */
declare const circleCIBuildRouteRef: _backstage_core_plugin_api.SubRouteRef<_backstage_core_plugin_api.PathParams<"/:buildId">>;

/** @public */
declare const isCircleCIAvailable: (entity: Entity) => boolean;
/** @public */
declare const Router: () => react__default.JSX.Element;

/** @public */
declare const CIRCLECI_ANNOTATION = "circleci.com/project-slug";

export { CIRCLECI_ANNOTATION, CircleCIApi, EntityCircleCIContent, Router, circleCIApiRef, circleCIBuildRouteRef, circleCIPlugin, circleCIRouteRef, isCircleCIAvailable, isCircleCIAvailable as isPluginApplicableToEntity, circleCIPlugin as plugin };
