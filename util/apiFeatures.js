/* eslint-disable node/no-unsupported-features/es-syntax */
class ApiFeature {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.totalProduct = 0;
    }

    filter(options) {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        let queryObj = { ...this.queryString };
        const fields = ['page', 'sort', 'fields', 'limit'];
        fields.forEach((el) => delete queryObj[el]);
        queryObj = JSON.stringify(queryObj);
        queryObj = queryObj.replace(
            /\b(gte|gt|lte|lt|text|search)\b/g,
            (match) => `$${match}`
        );
        if (queryObj.includes('$search')) {
            const temp = JSON.parse(queryObj);
            queryObj = { ...temp, $text: { $search: temp.$search } };
            queryObj.$search = undefined;
            queryObj = JSON.stringify(queryObj);
        }
        //console.log(JSON.parse(queryObj));
        const limit = options?.limit ? options?.limit : 0;
        this.query.find(JSON.parse(queryObj)).limit(limit);
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        this.totalProduct = this;
        return this;
    }

    fieldSelect() {
        if (this.queryString.fields) {
            const fieldBy = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fieldBy);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    // pagenate() {
    //     const tourPage = this.queryString.page * 1 || 1;
    //     const tourLimit = this.queryString.limit * 1 || 25;
    //     const tourSkip = (tourPage - 1) * tourLimit;
    //     this.query = this.query.skip(tourSkip).limit(tourLimit);
    //     return this;
    // }
}

module.exports = ApiFeature;
