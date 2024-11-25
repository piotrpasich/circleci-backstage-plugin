import { postBuildActions, BuildAction, getBuildSummaries, getMe, getFullBuild, GitType } from 'circleci-api';
import { createApiRef, createRouteRef, createSubRouteRef, createPlugin, createApiFactory, discoveryApiRef, createRoutableExtension, useApi, errorApiRef } from '@backstage/core-plugin-api';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Routes, Route } from 'react-router-dom';
import { Accordion, AccordionSummary, Typography, AccordionDetails, Box, Grid, makeStyles as makeStyles$1, IconButton, Tooltip, Avatar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { LogViewer, Breadcrumbs, Link, InfoCard, Progress, LinkButton, Table, StatusWarning, StatusOK, StatusError, StatusRunning, StatusPending, MissingAnnotationEmptyState } from '@backstage/core-components';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { DateTime, Interval } from 'luxon';
import humanizeDuration from 'humanize-duration';
import LaunchIcon from '@material-ui/icons/Launch';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { useEntity } from '@backstage/plugin-catalog-react';
import { getOr } from 'lodash/fp';
import RetryIcon from '@material-ui/icons/Replay';
import GitHubIcon from '@material-ui/icons/GitHub';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const circleCIApiRef = createApiRef({
  id: "plugin.circleci.service"
});
const DEFAULT_PROXY_PATH = "/circleci/api";
class CircleCIApi {
  constructor(options) {
    __publicField(this, "discoveryApi");
    __publicField(this, "proxyPath");
    var _a;
    this.discoveryApi = options.discoveryApi;
    this.proxyPath = (_a = options.proxyPath) != null ? _a : DEFAULT_PROXY_PATH;
  }
  async retry(buildNumber, options) {
    return postBuildActions("", buildNumber, BuildAction.RETRY, {
      circleHost: await this.getApiUrl(),
      ...options.vcs
    });
  }
  async getBuilds(pagination, options) {
    const { limit = 10, offset = 0 } = pagination;
    return getBuildSummaries("", {
      options: {
        limit,
        offset
      },
      vcs: {},
      circleHost: await this.getApiUrl(),
      ...options
    });
  }
  async getUser(options) {
    return getMe("", { circleHost: await this.getApiUrl(), ...options });
  }
  async getBuild(buildNumber, options) {
    return getFullBuild("", buildNumber, {
      circleHost: await this.getApiUrl(),
      ...options.vcs
    });
  }
  async getUrl(url) {
    return fetch(url).then((res) => res.json());
  }
  async getApiUrl() {
    const proxyUrl = await this.discoveryApi.getBaseUrl("proxy");
    return proxyUrl + this.proxyPath;
  }
}

const circleCIRouteRef = createRouteRef({
  id: "circle-ci"
});
const circleCIBuildRouteRef = createSubRouteRef({
  id: "circle-ci/build",
  parent: circleCIRouteRef,
  path: "/:buildId"
});

const circleCIPlugin = createPlugin({
  id: "circleci",
  apis: [
    createApiFactory({
      api: circleCIApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory: ({ discoveryApi }) => new CircleCIApi({ discoveryApi })
    })
  ]
});
const EntityCircleCIContent = circleCIPlugin.provide(
  createRoutableExtension({
    name: "EntityCircleCIContent",
    component: () => Promise.resolve().then(function () { return Router$1; }).then((m) => m.Router),
    mountPoint: circleCIRouteRef
  })
);

function relativeTimeTo(dateTimeISOString) {
  return dateTimeISOString ? DateTime.fromISO(dateTimeISOString).toRelative() : "";
}
function durationHumanized(startDateTimeISOString, endDateTimeISOString) {
  if (!startDateTimeISOString || !endDateTimeISOString) {
    return "";
  }
  const startDateTime = DateTime.fromISO(startDateTimeISOString);
  const endDateTime = DateTime.fromISO(endDateTimeISOString);
  const duration = Interval.fromDateTimes(
    startDateTime,
    endDateTime
  ).toDuration();
  return humanizeDuration(duration.as("milliseconds"), {
    largest: 1
  });
}

const useStyles$2 = makeStyles({
  accordionDetails: {
    padding: 0
  },
  button: {
    order: -1,
    marginRight: 0,
    marginLeft: "-20px"
  }
});
const ActionOutput = ({
  url,
  name,
  className,
  action
}) => {
  const classes = useStyles$2();
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    fetch(url).then((res) => res.json()).then((actionOutput) => {
      if (typeof actionOutput !== "undefined") {
        setMessages(
          actionOutput.map(({ message }) => message)
        );
      }
    });
  }, [url]);
  const timeElapsed = durationHumanized(action.start_time, action.end_time);
  return /* @__PURE__ */ React.createElement(Accordion, { TransitionProps: { unmountOnExit: true }, className }, /* @__PURE__ */ React.createElement(
    AccordionSummary,
    {
      expandIcon: /* @__PURE__ */ React.createElement(ExpandMoreIcon, null),
      "aria-controls": `panel-${name}-content`,
      id: `panel-${name}-header`,
      IconButtonProps: {
        className: classes.button
      }
    },
    /* @__PURE__ */ React.createElement(Typography, { variant: "button" }, name, " (", timeElapsed, ")")
  ), /* @__PURE__ */ React.createElement(AccordionDetails, { className: classes.accordionDetails }, messages.length === 0 ? "Nothing here..." : /* @__PURE__ */ React.createElement("div", { style: { height: "20vh", width: "100%" } }, /* @__PURE__ */ React.createElement(LogViewer, { text: messages.join("\n") }))));
};

const useAsyncPolling = (pollingFn, interval) => {
  const isPolling = useRef(false);
  const startPolling = async () => {
    if (isPolling.current === true)
      return;
    isPolling.current = true;
    while (isPolling.current === true) {
      await pollingFn();
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  };
  const stopPolling = () => {
    isPolling.current = false;
  };
  return { startPolling, stopPolling };
};

const CIRCLECI_ANNOTATION = "circleci.com/project-slug";

const makeReadableStatus = (status) => {
  if (!status)
    return "";
  return {
    retried: "Retried",
    canceled: "Canceled",
    infrastructure_fail: "Infra fail",
    timedout: "Timedout",
    not_run: "Not run",
    running: "Running",
    failed: "Failed",
    queued: "Queued",
    scheduled: "Scheduled",
    not_running: "Not running",
    no_tests: "No tests",
    fixed: "Fixed",
    success: "Success"
  }[status];
};
const mapWorkflowDetails = (buildData) => {
  const { workflows } = buildData != null ? buildData : {};
  return {
    id: workflows == null ? void 0 : workflows.workflow_id,
    url: `${buildData.build_url}/workflows/${workflows == null ? void 0 : workflows.workflow_id}`,
    jobName: workflows == null ? void 0 : workflows.job_name,
    name: workflows == null ? void 0 : workflows.workflow_name
  };
};
const mapSourceDetails = (buildData) => {
  const commitDetails = getOr({}, "all_commit_details[0]", buildData);
  return {
    branchName: String(buildData.branch),
    commit: {
      hash: String(buildData.vcs_revision),
      shortHash: String(buildData.vcs_revision).slice(0, 7),
      committerName: buildData.committer_name,
      url: commitDetails.commit_url
    }
  };
};
const mapUser = (buildData) => {
  var _a, _b, _c, _d;
  return {
    isUser: ((_a = buildData == null ? void 0 : buildData.user) == null ? void 0 : _a.is_user) || false,
    login: ((_b = buildData == null ? void 0 : buildData.user) == null ? void 0 : _b.login) || "none",
    name: (_c = buildData == null ? void 0 : buildData.user) == null ? void 0 : _c.name,
    avatarUrl: (_d = buildData == null ? void 0 : buildData.user) == null ? void 0 : _d.avatar_url
  };
};
const transform = (buildsData, restartBuild) => {
  return buildsData.map((buildData) => {
    const tableBuildInfo = {
      id: String(buildData.build_num),
      buildName: buildData.subject ? buildData.subject + (buildData.retry_of ? ` (retry of #${buildData.retry_of})` : "") : "",
      startTime: buildData.start_time,
      stopTime: buildData.stop_time,
      onRestartClick: () => typeof buildData.build_num !== "undefined" && restartBuild(buildData.build_num),
      source: mapSourceDetails(buildData),
      workflow: mapWorkflowDetails(buildData),
      user: mapUser(buildData),
      status: makeReadableStatus(buildData.status),
      buildUrl: buildData.build_url
    };
    return tableBuildInfo;
  });
};
const useProjectSlugFromEntity = () => {
  var _a, _b;
  const { entity } = useEntity();
  const [vcs, owner, repo] = ((_b = (_a = entity.metadata.annotations) == null ? void 0 : _a[CIRCLECI_ANNOTATION]) != null ? _b : "").split("/");
  return { vcs, owner, repo };
};
function mapVcsType(vcs) {
  switch (vcs) {
    case "gh":
    case "github":
      return GitType.GITHUB;
    default:
      return GitType.BITBUCKET;
  }
}
function useBuilds() {
  const { repo, owner, vcs } = useProjectSlugFromEntity();
  const api = useApi(circleCIApiRef);
  const errorApi = useApi(errorApiRef);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const getBuilds = useCallback(
    async ({ limit, offset }) => {
      if (owner === "" || repo === "" || vcs === "") {
        return Promise.reject("No credentials provided");
      }
      try {
        return await api.getBuilds(
          { limit, offset },
          {
            vcs: {
              owner,
              repo,
              type: mapVcsType(vcs)
            }
          }
        );
      } catch (e) {
        errorApi.post(e);
        return Promise.reject(e);
      }
    },
    [repo, owner, vcs, api, errorApi]
  );
  const restartBuild = async (buildId) => {
    try {
      await api.retry(buildId, {
        vcs: {
          owner,
          repo,
          type: mapVcsType(vcs)
        }
      });
    } catch (e) {
      errorApi.post(e);
    }
  };
  useEffect(() => {
    getBuilds({ limit: 1, offset: 0 }).then((b) => setTotal(b == null ? void 0 : b[0].build_num));
  }, [repo, getBuilds]);
  const { loading, value, retry } = useAsyncRetry(
    () => getBuilds({
      offset: page * pageSize,
      limit: pageSize
    }).then((builds) => transform(builds != null ? builds : [], restartBuild)),
    [page, pageSize, getBuilds]
  );
  const projectName = `${owner}/${repo}`;
  return [
    {
      page,
      pageSize,
      loading,
      value,
      projectName,
      total
    },
    {
      getBuilds,
      setPage,
      setPageSize,
      restartBuild,
      retry
    }
  ];
}

const INTERVAL_AMOUNT = 1500;
function useBuildWithSteps(buildId) {
  const { vcs, repo, owner } = useProjectSlugFromEntity();
  const api = useApi(circleCIApiRef);
  const errorApi = useApi(errorApiRef);
  const vcsOption = useMemo(
    () => ({
      owner,
      repo,
      type: mapVcsType(vcs)
    }),
    [owner, repo, vcs]
  );
  const getBuildWithSteps = useCallback(async () => {
    if (owner === "" || repo === "" || vcs === "") {
      return Promise.reject("No credentials provided");
    }
    try {
      const options = {
        vcs: vcsOption
      };
      const build = await api.getBuild(buildId, options);
      return Promise.resolve(build);
    } catch (e) {
      errorApi.post(e);
      return Promise.reject(e);
    }
  }, [vcsOption, buildId, api, errorApi]);
  const restartBuild = async () => {
    try {
      await api.retry(buildId, {
        vcs: vcsOption
      });
    } catch (e) {
      errorApi.post(e);
    }
  };
  const { loading, value, retry } = useAsyncRetry(
    () => getBuildWithSteps(),
    [getBuildWithSteps]
  );
  const { startPolling, stopPolling } = useAsyncPolling(
    getBuildWithSteps,
    INTERVAL_AMOUNT
  );
  return [
    { loading, value, retry },
    {
      restartBuild,
      getBuildWithSteps,
      startPolling,
      stopPolling
    }
  ];
}

const BuildName = ({ build }) => /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center" }, "#", build == null ? void 0 : build.build_num, " - ", build == null ? void 0 : build.subject, /* @__PURE__ */ React.createElement(LinkButton, { to: (build == null ? void 0 : build.build_url) || "#" }, /* @__PURE__ */ React.createElement(LaunchIcon, null)));
const useStyles$1 = makeStyles((theme) => ({
  neutral: {},
  failed: {
    position: "relative",
    "&:after": {
      pointerEvents: "none",
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      boxShadow: `inset 4px 0px 0px ${theme.palette.error.main}`
    }
  },
  running: {
    position: "relative",
    "&:after": {
      pointerEvents: "none",
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      boxShadow: `inset 4px 0px 0px ${theme.palette.info.main}`
    }
  },
  cardContent: {
    backgroundColor: theme.palette.background.default
  },
  success: {
    position: "relative",
    "&:after": {
      pointerEvents: "none",
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      boxShadow: `inset 4px 0px 0px ${theme.palette.success.main}`
    }
  }
}));
const pickClassName = (classes, build = {}) => {
  if (build.failed)
    return classes.failed;
  if (["running", "queued"].includes(build.status))
    return classes.running;
  if (build.status === "success")
    return classes.success;
  return classes.neutral;
};
const ActionsList = ({
  actions
}) => {
  const classes = useStyles$1();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, actions.map((action) => /* @__PURE__ */ React.createElement(
    ActionOutput,
    {
      className: action.failed ? classes.failed : classes.success,
      action,
      name: action.name,
      url: action.output_url || ""
    }
  )));
};
const BuildsList = ({ build }) => /* @__PURE__ */ React.createElement(Box, null, build && build.steps && build.steps.map(
  ({ name, actions }) => /* @__PURE__ */ React.createElement(ActionsList, { key: name, name, actions })
));
const BuildWithStepsPage = () => {
  const { buildId = "" } = useParams();
  const classes = useStyles$1();
  const [{ loading, value }, { startPolling, stopPolling }] = useBuildWithSteps(
    parseInt(buildId, 10)
  );
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [buildId, startPolling, stopPolling]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Box, { mb: 3 }, /* @__PURE__ */ React.createElement(Breadcrumbs, { "aria-label": "breadcrumb" }, /* @__PURE__ */ React.createElement(Link, { to: ".." }, "All builds"), /* @__PURE__ */ React.createElement(Typography, null, "Build details"))), /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 3, direction: "column" }, /* @__PURE__ */ React.createElement(Grid, { item: true }, /* @__PURE__ */ React.createElement(
    InfoCard,
    {
      className: pickClassName(classes, value),
      title: /* @__PURE__ */ React.createElement(BuildName, { build: value }),
      cardClassName: classes.cardContent
    },
    loading ? /* @__PURE__ */ React.createElement(Progress, null) : /* @__PURE__ */ React.createElement(BuildsList, { build: value })
  ))));
};

const getStatusComponent = (status = "") => {
  switch (status.toLocaleLowerCase("en-US")) {
    case "queued":
    case "scheduled":
      return /* @__PURE__ */ React.createElement(StatusPending, null);
    case "running":
      return /* @__PURE__ */ React.createElement(StatusRunning, null);
    case "failed":
      return /* @__PURE__ */ React.createElement(StatusError, null);
    case "success":
      return /* @__PURE__ */ React.createElement(StatusOK, null);
    case "canceled":
    default:
      return /* @__PURE__ */ React.createElement(StatusWarning, null);
  }
};
const useStyles = makeStyles$1((theme) => ({
  root: {
    display: "flex",
    "& > *": {
      margin: theme.spacing(1),
      verticalAlign: "center"
    }
  },
  small: {
    width: theme.spacing(3),
    height: theme.spacing(3)
  }
}));
const SourceInfo = ({ build }) => {
  var _a, _b, _c;
  const classes = useStyles();
  const { user, source } = build;
  return /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center", className: classes.root }, /* @__PURE__ */ React.createElement(Tooltip, { title: (_a = user.name) != null ? _a : user.login }, /* @__PURE__ */ React.createElement(
    Avatar,
    {
      alt: user.name,
      src: user.avatarUrl,
      className: classes.small
    }
  )), /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(Typography, { variant: "button" }, source == null ? void 0 : source.branchName), /* @__PURE__ */ React.createElement(Typography, { variant: "body1" }, ((_b = source == null ? void 0 : source.commit) == null ? void 0 : _b.url) !== void 0 ? /* @__PURE__ */ React.createElement(Link, { to: (_c = source == null ? void 0 : source.commit) == null ? void 0 : _c.url }, source == null ? void 0 : source.commit.shortHash) : source == null ? void 0 : source.commit.shortHash)));
};
const generatedColumns = [
  {
    title: "ID",
    field: "id",
    type: "numeric",
    width: "80px"
  },
  {
    title: "Build",
    field: "buildName",
    highlight: true,
    width: "20%",
    render: (row) => {
      var _a;
      return row.buildName ? row.buildName : (_a = row == null ? void 0 : row.workflow) == null ? void 0 : _a.name;
    }
  },
  {
    title: "Job",
    field: "buildName",
    highlight: true,
    render: (row) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement(Link, { to: (_a = row == null ? void 0 : row.buildUrl) != null ? _a : "" }, /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center" }, /* @__PURE__ */ React.createElement(LaunchIcon, { fontSize: "small", color: "disabled" }), /* @__PURE__ */ React.createElement(Box, { mr: 1 }), (_b = row == null ? void 0 : row.workflow) == null ? void 0 : _b.jobName));
    }
  },
  {
    title: "Source",
    field: "source.commit.hash",
    highlight: true,
    render: (row) => /* @__PURE__ */ React.createElement(SourceInfo, { build: row })
  },
  {
    title: "Status",
    field: "status",
    render: (row) => /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center" }, getStatusComponent(row.status), /* @__PURE__ */ React.createElement(Box, { mr: 1 }), /* @__PURE__ */ React.createElement(Typography, { variant: "button" }, row.status))
  },
  {
    title: "Time",
    field: "startTime",
    render: (row) => (row == null ? void 0 : row.startTime) ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Typography, { variant: "body2" }, "run ", relativeTimeTo(row == null ? void 0 : row.startTime)), /* @__PURE__ */ React.createElement(Typography, { variant: "body2" }, (row == null ? void 0 : row.stopTime) ? `took ${durationHumanized(row == null ? void 0 : row.startTime, row == null ? void 0 : row.stopTime)}` : "")) : null
  },
  {
    title: "Workflow",
    field: "workflow.name",
    highlight: true,
    render: (row) => {
      var _a, _b;
      return /* @__PURE__ */ React.createElement(
        Link,
        {
          to: `https://app.circleci.com/pipelines/workflows/${(_a = row == null ? void 0 : row.workflow) == null ? void 0 : _a.id}`
        },
        /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center" }, /* @__PURE__ */ React.createElement(LaunchIcon, { fontSize: "small", color: "disabled" }), /* @__PURE__ */ React.createElement(Box, { mr: 1 }), (_b = row == null ? void 0 : row.workflow) == null ? void 0 : _b.name)
      );
    }
  },
  {
    title: "Actions",
    width: "10%",
    render: (row) => /* @__PURE__ */ React.createElement(IconButton, { onClick: row.onRestartClick }, /* @__PURE__ */ React.createElement(RetryIcon, null))
  }
];
const CITable = ({
  projectName,
  loading,
  pageSize,
  page,
  retry,
  builds,
  onChangePage,
  onChangePageSize,
  total
}) => {
  return /* @__PURE__ */ React.createElement(
    Table,
    {
      isLoading: loading,
      options: {
        paging: true,
        pageSize,
        padding: "dense",
        pageSizeOptions: [10, 20, 50]
      },
      totalCount: total,
      page,
      actions: [
        {
          icon: () => /* @__PURE__ */ React.createElement(RetryIcon, null),
          tooltip: "Refresh Data",
          isFreeAction: true,
          onClick: () => retry()
        }
      ],
      data: builds,
      onPageChange: onChangePage,
      onRowsPerPageChange: onChangePageSize,
      title: /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center" }, /* @__PURE__ */ React.createElement(GitHubIcon, null), /* @__PURE__ */ React.createElement(Box, { mr: 1 }), /* @__PURE__ */ React.createElement(Typography, { variant: "h6" }, projectName)),
      columns: generatedColumns
    }
  );
};

const Builds = () => {
  const [
    { total, loading, value, projectName, page, pageSize },
    { setPage, retry, setPageSize }
  ] = useBuilds();
  return /* @__PURE__ */ React.createElement(
    CITable,
    {
      total,
      loading,
      retry,
      builds: value != null ? value : [],
      projectName,
      page,
      onChangePage: setPage,
      pageSize,
      onChangePageSize: setPageSize
    }
  );
};

const BuildsPage = () => /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 3, direction: "column" }, /* @__PURE__ */ React.createElement(Grid, { item: true }, /* @__PURE__ */ React.createElement(Builds, null)));

const isCircleCIAvailable = (entity) => {
  var _a;
  return Boolean((_a = entity.metadata.annotations) == null ? void 0 : _a[CIRCLECI_ANNOTATION]);
};
const Router = () => {
  const { entity } = useEntity();
  if (!isCircleCIAvailable(entity)) {
    return /* @__PURE__ */ React.createElement(MissingAnnotationEmptyState, { annotation: CIRCLECI_ANNOTATION });
  }
  return /* @__PURE__ */ React.createElement(Routes, null, /* @__PURE__ */ React.createElement(Route, { path: "/", element: /* @__PURE__ */ React.createElement(BuildsPage, null) }), /* @__PURE__ */ React.createElement(
    Route,
    {
      path: `${circleCIBuildRouteRef.path}`,
      element: /* @__PURE__ */ React.createElement(BuildWithStepsPage, null)
    }
  ));
};

var Router$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  isCircleCIAvailable: isCircleCIAvailable,
  Router: Router
});

export { CIRCLECI_ANNOTATION, CircleCIApi, EntityCircleCIContent, Router, circleCIApiRef, circleCIBuildRouteRef, circleCIPlugin, circleCIRouteRef, isCircleCIAvailable, isCircleCIAvailable as isPluginApplicableToEntity, circleCIPlugin as plugin };
//# sourceMappingURL=index.esm.js.map
