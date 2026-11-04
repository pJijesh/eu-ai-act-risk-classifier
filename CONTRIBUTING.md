# Contributing

Corrections to the rules are the most useful contribution. The AI Act is still being interpreted and amended, so if an article reference, obligation or date is wrong, please open an issue or a pull request.

1. All rules live in `src/rules.js`. The web app, the CLI and the tests read from there, so a change there updates all three.
2. Cite the article or annex number for any change, and link to the Official Journal text (EUR-Lex) in the pull request.
3. Run `npm test` before you push. There are no dependencies to install.
4. If you change a date, update `META.verifiedOn` and the matching test.
