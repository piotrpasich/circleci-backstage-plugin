/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createPlugin, createApiFactory, configApiRef } from '@backstage/core';
import { circleCIRouteRef, circleCIBuildRouteRef } from './route-refs';
import BuildsPage from './pages/BuildsPage/BuildsPage';
import BuildWithStepsPage from './pages/BuildWithStepsPage/BuildWithStepsPage';
import { circleCIApiRef, CircleCIApi } from './api';

export const plugin = createPlugin({
  id: 'circleci',
  apis: [
    createApiFactory({
      implements: circleCIApiRef,
      deps: { configApi: configApiRef },
      factory: ({ configApi }) =>
        new CircleCIApi(
          `${configApi.getString('backend.baseUrl')}/proxy/circleci/api`,
        ),
    }),
  ],
  register({ router }) {
    router.addRoute(circleCIRouteRef, BuildsPage);
    router.addRoute(circleCIBuildRouteRef, BuildWithStepsPage);
  },
});
