export default function() {
    const chunk = require("lodash/chunk");

    return chunk([1, 2, 3, 4], 2);
}
