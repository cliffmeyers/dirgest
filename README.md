# dirgest

Computes a directory's digest.

For example, running against a `coverage` dir with lcov output:

```
const dir = new Dirgest()
    .dirgest('./coverage')
    .then(result => console.log(result));

{
    "files": {
        "lcov.info": "47b9c27705c92a95db66606ce0c02847108d523d",
        "lcov-report": {
            "files": {
                "dirgest.ts.html": "37a31efa45f0a284d27c324ae21d039cd279c3f6",
                "block-navigation.js": "dc39fb861b8f3e77d1488dc8fcbf4b5c89096b60",
                "index.html": "eb28f0d584a81c814d8670ab2715808e7c406906",
                "base.css": "17e0e11ed35634e29a77ab7eed97993f03e69a06",
                "prettify.css": "c913ae292c2060519657a2ce6d8366a09e71004b",
                "sort-arrow-sprite.png": "644ef97e19b95b91654775fe672bf32acf33c8b4",
                "prettify.js": "c5da667a2551890ac47513d4f160f478d2f565f0",
                "sorter.js": "6e9587eb865a23b875afdcf7020eb41e7e04473d"
            },
            "hash": "81b86c5b175a16f77f1cbd32631d64be3749b1cb"
        }
    },
    "hash": "f6b0ba81f6254ada284095062d32c0588a23bc6b"
}
```

## Running unit tests

Run `npm t` to execute the unit tests via [Jest](https://jestjs.io).
