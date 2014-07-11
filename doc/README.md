# Internals

## Tokens

The tokens are strong in the array `tokens` which has the following structure. The example results from the value `We-Fr 10:00-24:00 open "it is open" || 2012 "please call"; Jan 1 open "should never appear"` which is in the test framework.

The most inner array represents one token. The first element of this array is the [lexeme](https://en.wikipedia.org/wiki/Lexeme) (an internal representation of the token value). The second element is the token name and the third one is the start position of the token in the input stream (which is used for generation warnings and let the user know the position where the problem occurred). The fourth element is optional and specifies appears at the start of a token group and gives a hint to which sup parser the token group belongs to.

```javascript
[ // Tokenized input stream
    [ // One rule
        [ // All tokens of one rule
            [
                3,
                "weekday",
                91,
                "weekday"
            ],
            [ // Still belongs to token group "weekday".
                "-",
                "-",
                89
            ],
            [
                5,
                "weekday",
                88
            ],
            [
                10,
                "number",
                85,
                "time" // Start of new token group "time".
            ],
            [
                ":",
                "timesep",
                83
            ],
            [
                0,
                "number",
                82
            ],
            [
                "-",
                "-",
                80
            ],
            [
                24,
                "number",
                79
            ],
            [
                ":",
                "timesep",
                77
            ],
            [
                0,
                "number",
                76
            ],
            [
                "open",
                "state",
                73
            ],
            [
                "it is open",
                "comment",
                68
            ]
        ],
        false,
        55
    ],
    [
        [
            [
                "2012",
                "year",
                52,
                "year"
            ],
            [
                "please call",
                "comment",
                47
            ]
        ],
        true,
        34
    ],
    [
        [
            [
                0,
                "month",
                32,
                "month"
            ],
            [
                1,
                "number",
                28
            ],
            [
                "open",
                "state",
                26
            ],
            [
                "should never appear",
                "comment",
                21
            ]
        ],
        false
    ]
]
```
