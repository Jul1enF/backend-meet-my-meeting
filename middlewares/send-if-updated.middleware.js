
// A logic of response for no corresponding datas found has te be set before :

// const users = await User.find()
// if (!users.length){
//     return res.json({result : false, errorText: "Aucun utilisateur trouvé en bdd !"})
// }else{
//     res.locals.searchResult = { dataName : "users", data : users}
//     next(); 
// }

// Doesn't work if the datas were search with a .select() that doesn't include the _id and the udpatedAt !!!!

// If datas are not store persistantly in the front or can be lost after this response, send a if-none-match erased for the first fetch (http cache could have the same etag)

// If there is a possibility that a user post a doc and another one suppress it, docs count has to be sent

// Constants has to be sent in an object with key name === "constants"

const crypto = require("crypto");


// Function to extract mongo docs state, potential constants state an count the number of object/array
const getEtagBase = (data) => {

    let docsCount = 0
    const visitedDocs = new WeakSet()
    const visitedConstants = new WeakSet()

    // Function to extract the values of the constants to send
    const extractConstantState = (constant) => {

        let constantStateInfos = []

        if (!constant || typeof constant !== "object" || visitedConstants.has(constant)) return ""

        visitedConstants.add(constant);

        if (Array.isArray(constant)) {
            constant.forEach(e => {
                if (typeof e === "object") constantStateInfos.push(extractConstantState(e))
                else constantStateInfos.push(e?.toString() ?? "null")
            })
        }
        else {
            for (let key in constant) {
                const value = constant[key]
                if (typeof value === "object") constantStateInfos.push(extractConstantState(value))
                else constantStateInfos.push(value?.toString() ?? "null")
            }
        }

        return constantStateInfos.join("-")
    }


    // Function to search for mongo docs and extract their ids and updatedAt or extract constants informations
    const extractDocState = (doc) => {

        if (!doc || typeof doc !== "object" || visitedDocs.has(doc)) return "";

        visitedDocs.add(doc)

        // Add a doc to the count
        if (doc._id) {
            // console.log("BACK COUNT:", doc._id) 
            docsCount += 1
        }

        // Array to receive the ids and updatedAt if mongo doc found
        let docStateInfos = [];

        if (Array.isArray(doc)) {
            doc.forEach(e => docStateInfos.push(extractDocState(e)))
        }
        else {
            doc._id && docStateInfos.push(doc._id.toString());
            doc.updatedAt && docStateInfos.push(new Date(doc.updatedAt).getTime());

            // Searching inside an object for constants or mongo doc
            for (const key in doc) {
                const val = doc[key];

                // If it is a constant object
                if (key === "constants") {
                    docStateInfos.unshift(extractConstantState(val))
                }
                // If it is an array
                else if (Array.isArray(val) && val.length) {
                    val.forEach(e => docStateInfos.push(extractDocState(e)))
                }
                // If it is an object
                else if (val && typeof val === "object") {
                    docStateInfos.push(extractDocState(val));
                }
            }
        }
        return docStateInfos.join("-");
    }

    // Deserialize data if they have been serialized (by a .lean())
    const deserializedData = JSON.parse(JSON.stringify(data))
    const etagBase = extractDocState(deserializedData)

    return { etagBase, docsCount }
}



const sendIfUpdated = (req, res, next) => {
    const { dataName, data } = res.locals.searchResult;
    if (!data) throw new Error("sendIfUpdated requires res.locals.searchResult to be set.");

    let { etagBase, docsCount } = getEtagBase(data);

    // Hash to not have an infinite ETag
    const etagBaseSha1String = crypto.createHash("sha1").update(etagBase).digest("hex")

    const ifNoneMatch = req.headers["if-none-match"]
    const etagRegex = new RegExp(etagBaseSha1String)
    const frontDocsCount = req.headers["x-docs-count"]

    const docsCountMismatch = frontDocsCount !== undefined && Number(frontDocsCount) !== docsCount

    if (!ifNoneMatch || !etagRegex.test(ifNoneMatch) || docsCountMismatch) {
        const etag = 'W/"' + etagBaseSha1String + '"';
        res.setHeader("ETag", etag);
        return res.status(200).json({ result: true, [dataName]: data });
    }
    else {
        const etag = 'W/"' + etagBaseSha1String + "dataNotModified" + '"';
        res.setHeader("ETag", etag);
        return res.status(200).json({ result: true, notModified: true })
    }
}

module.exports = { sendIfUpdated }
