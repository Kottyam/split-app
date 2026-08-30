# Shared Home recurring budget checkbox verification

The current Kharcha dev preview was opened and navigated through Shared Homes → a temporary Shared Home → Manage → Recurring → Add Rule.

The rendered Add Rule dialog visibly contains:

- `Include in Budget` as a checkbox label.
- Helper text: `Turn off if this expense should not reduce your budget. It will still be recorded normally.`
- The checkbox is checked by default.
- The checkbox is rendered before the `Automatically add fixed amount each month` option.

This confirms the current working preview contains the requested control. If a production deployment still does not show it, the deployed site is serving an older checkpoint and needs the current checkpoint published.
