# printable-calendar

A calendar application that will create PDFs set to print each month such that it fills an A2 sized page.

## Installation

There are currently only builds available for 64-bit Windows.

To install:

1. Go to the [releases page](https://github.com/paulholtom/printable-calendar/releases) and download the Setup.exe file from the latest release.
2. Run the setup.exe file once it is donwloaded.

## Updates

The application will automatically update itself when started up, when an update is ready you will be prompted to restart the application.

## Troubleshooting

If you encounter errors when starting the app your config file may be corrupted. Try deleting or renaming the file then starting the application again. You can find the file at:

- Windows: `%appdata%\printable-calendar\user-config.json`

## Development

### Running Locally

To run this code locally.

1. Clone this repository.
2. Run `npm i`.
3. Run `npm run start`.

### Tests

`npm run test:unit`

### Lint

`npm run lint`

### Type Check

`npm run type-check`

### Release

1. [Create a Github fine grained PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) with the following permissions on this repository:
    - Read access to metadata
    - Read and Write access to code
2. Set the `GITHUB_TOKEN` environment variable to the generated PAT. One way to do this is to create a `.env` file at the root of this folder with contents like

```
GITHUB_TOKEN=github_pat_abc123
```

3. Run `npm run release:{major|minor|patch}`
