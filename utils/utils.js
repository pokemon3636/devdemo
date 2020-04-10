class utils {
    static generateDate() {
        let nowYear = new Date().getFullYear().toString();
        let nowMonth = (new Date().getMonth() + 1).toString();
        let nowDay = new Date().getDate().toString();
        let nowHours = new Date().getHours().toString();
        let nowMin = new Date().getMinutes().toString();
        let nowSeconds = new Date().getSeconds().toString();
        let padLeftZero = (str) => {
            if (str.length <= 1) {
                str = '0' + str;
            }
            return str
        }
        nowMonth = padLeftZero(nowMonth);
        nowDay = padLeftZero(nowDay);
        nowHours = padLeftZero(nowHours);
        nowMin = padLeftZero(nowMin);
        nowSeconds = padLeftZero(nowSeconds);
        let newDate = nowYear + nowMonth + nowDay + nowHours + nowMin + nowSeconds;
        return newDate;
    }

    static rmdir(dir) {
        return new Promise((resolve, reject) => {
            fs.stat(dir, function (err, status) {
                if (status.isDirectory()) {
                    fs.readdir(dir, function (err, file) {
                        let res = file.map((item) => rmdir(path.join(dir, item)))
                        Promise.all(res).then(() => {
                            fs.rmdir(dir, resolve);
                        })
                    })
                } else {
                    fs.unlink(dir, resolve);
                }
            })
        })
    }

    static getArgv() {
        const argv = process.argv;
        argv.splice(0, 2);
        return argv;
    }

    static sleep(n) {
        return new Promise(res => setTimeout(res, n))
    }

    static createPassword() {
        var devpassword = createRandomString(8, "numbers and lower case letters");
        var charvalidation = /(?=.*\d)(?=.*[a-z])/;

        function createRandomString(num_of_chars, policy) {
            var randomstring = "";
            var allowedcharacters = "";
        
            switch (policy) {
                // 小文字のみの場合
                case "lower case letters only":
                    allowedcharacters = "abcdefghijklmnopqrstuvwxyz";
                    break;
        
                // 小文字+数字の場合
                case "numbers and lower case letters":
                    allowedcharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
                    break;
            }
        
            for (var j = 0; j < num_of_chars; j++) {
                randomstring += allowedcharacters.charAt(Math.floor(Math.random() * allowedcharacters.length));
            }
            return randomstring;
        }
    
        // check Password パスワードは数字と文字列の組み合わせである必要がある
        while (charvalidation.test(devpassword) === false) {
            devpassword = createRandomString(8, "numbers and lower case letters");
        }
    
        return devpassword;
    }  
}

module.exports = utils;
