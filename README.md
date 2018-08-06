# @radmen/timew-aggro

I've started to use [Time Warrior](https://taskwarrior.org/docs/timewarrior/index.html) to track the time I spend on tasks.

Quite often I `stop` them and `continue` later. The default `taskw summary` command lists all of entries, event if they were continuations of previous ones.

This utility is responsible for merging those tasks into single one and displaying aggregated time.

# installation

```
yarn global add @radmen/timew-aggro
```

# usage

```bash
timew summary | timew-aggro
```

# use it on you own risk

This package is provided _as is_.
