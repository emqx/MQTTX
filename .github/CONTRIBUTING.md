# Contributing Guide

Hi, thanks for your support to [MQTT X](https://mqttx.app).

If you find a problem 🐛 or have a better idea 💡 during use, you can modify the project code by following ways and participate in the project contribution.

1. Fork this repository

2. Run the project as follows

    ``` shell
    # Install dependencies
    cd MQTTX
    yarn install

    # Compiles and hot-reloads for development
    yarn run electron:serve

    # Compiles and minifies for production
    yarn run electron:build
    ```

3. Add upstream remote

    ```shell
    git remote add upstream git@github.com:emqx/MQTTX.git
    ```

4. The code can be modified according to the following project structure:

    ```shell
    src
      ├── App.vue # Main view component
      ├── api # API collection requesting data
      ├── assets # Resource
      │   ├── font
      │   ├── images
      │   └── scss
      ├── background.ts # Main file of the main process
      ├── components # Common components collection
      ├── database # Database configuration file
      ├── lang # I18n configuration file
      ├── main # Code to operate the main process
      ├── main.ts # The main file of the render process
      ├── plugins # Extend Vue plugins
      ├── router # View routing configuration code
      ├── store # Vuex state management configuration code
      ├── types # Type definition collection
      ├── utils # Collection of general tools
      └── views # The main code collection of the view
          ├── Home.vue
          ├── about
          ├── connections
          ├── log
          ├── script
          ├── settings
          └── window
    ```

5. Add commit on new branch, push it. Please refer to the following instructions for commit specifications

    - Basic format

    `<type>(<scope>): <subject>`

    `type` indicates the type of submission, `scope` indicates the scope of modification submitted, `subject` indicates the main description content.

    For example:

    ```shell
    git commit -m "fix(index.vue): fix the mqtt connect bug"
    ```

    - type

      - feat: New feature
      - fix: Fix bug
      - refactor: Refactor, neither fixing bugs nor new features
      - style: Modify UI style or code format
      - docs: Documentation
      - perf: Performance
      - revert: Revert
      - test: Add test cases
      - ci: Continuous integration
      - build || chore: Changes in build tools or dependent packages

6. Submit a pull request to the `dev/*` branch of the upstream repository, and we will review it. The repository will contain at least one `dev/${version}` branch.

7. Release process, pull down the latest master branch `maste` in the current `dev/*` branch, use `npm version [patch | minor | major]'commit message'` to generate a new commit, and finally use rebase merge to merge into The master branch `master`.

Thanks for your reading! Hope enjoying! :)
