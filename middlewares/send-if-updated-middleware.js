
// A logic of response for no corresponding datas found has te be set before :

// const users = await User.find()
// if (!users.length){
//     return res.json({result : false, error : "Aucun utilisateur trouvé en bdd !"})
// }else{
//     res.locals.searchResult = { dataName : "users", data : users}
//     next(); 
// }

// Doesn't work if the datas were search with a .select() that doesn't include the _id and the udpatedAt !!!!


const crypto = require("crypto");


// Function to extract ids and updatedAt, including for potentials populated foreign keys
const extractDocState = (doc) => {
    if (!doc || typeof doc !== "object") return "";

    let docStateInfos = [];

    doc._id && docStateInfos.push(doc._id.toString());
    doc.updatedAt && docStateInfos.push(new Date(doc.updatedAt).getTime());

    // For foreign keys that were populated
    for (const key in doc) {
        const val = doc[key];

        // If it was a single foreign key that was populated
        if (val && typeof val === "object" && val._id) {
            docStateInfos.push(extractDocState(val));
        }

        // If there were several of them
        else if (Array.isArray(val) && val.length && val[0]?._id) {
            for (const sub of val) {
                docStateInfos.push(extractDocState(sub));
            }
        }
    }

    return docStateInfos.join("-");
}


const sendIfUpdated = (req, res, next) => {
    const { dataName, data } = res.locals.searchResult;
    if (!data) throw new Error("sendIfUpdated requires res.locals.searchResult to be set.");

    let etagBase;

    if (Array.isArray(data)) {
        etagBase = data.map(doc => extractDocState(doc)).join("|");
    }
    else {
        etagBase = extractDocState(data);
    }

    // Hash to not have an infinite ETag
    const etag = 'W/"' + crypto.createHash("sha1").update(etagBase).digest("hex") + '"';

    const ifNoneMatch = req.headers["if-none-match"];
    if (ifNoneMatch && ifNoneMatch === etag) {
        return res.status(304).end();
    }

    res.setHeader("ETag", etag);
    return res.status(200).json({ result: true, [dataName] : data });
}

module.exports={ sendIfUpdated }
