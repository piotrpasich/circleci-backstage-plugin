# CircleCI Backstage Plugin Fork

This repository is a fork of the original [CircleCI Backstage Plugin](https://www.npmjs.com/package/@circleci/backstage-plugin?activeTab=code) available on npm.

## Background
As of October 2024, the original CircleCI Backstage plugin faced issues due to changes introduced by CircleCI, specifically the addition of CORS restrictions on their API. These changes prevented the API from being directly callable from the frontend, which disrupted the functionality of viewing build previews directly within Backstage.

## Solution
This fork addresses these limitations by implementing a workaround that bypasses the CORS issues, ensuring that the functionality of previewing CircleCI builds within Backstage remains operational.

## Features
- **CORS Issue Fix:** Implements a solution to handle CORS, allowing API calls to successfully return data needed for build previews.
- **Build Preview:** Continues to support the viewing of CircleCI build statuses and details directly within Backstage.

## Installation
To install this forked version of the plugin, specify the package with the scoped name and version in your Backstage app's `package.json`:

```json
"dependencies": {
  "@piotr.pasich/circleci-backstage-plugin": "^1.1.4"
}
