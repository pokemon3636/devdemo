
// const directReturnField = {
//     "NUMBER","DATETIME",
// };

class utils {
    
    // inArray (search, array)  {
    //     for (var i in array) {
    //         if (array[i] == search) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    SeparateValue (record)  {
        let type = record.type;
        let value = record.value;
        if (typeof(value) === "string")
        {
            return value;
        }
        // else
        // {
        //     return record;
        // }
        
    }
}

module.exports = utils;
