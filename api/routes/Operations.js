class Operations {
    gettingTodayDate() {
        var datetime = Date.now();
        return datetime;
    }

    getThisWeekDate() {
        var days = 7
        var date = new Date();
        var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
        var da = last.toISOString().split("T");
        console.log(da);
        return da[0];
    }

    prepareGettingIdsResposne(response) {
        let msgs = response.body.messages
        return {
            "data": {
                "messages": msgs
            }
        };
    }

    getMsg(message) {
        var deliveredTo = null;
        var from = null;
        var subject = null;
        var date = null;
        var messageId = null;
        var body = null;
        message.payload.headers.forEach((header) => {
            let key = header.name.toString().toUpperCase();
                
            if (key == "Delivered-To".toUpperCase()) {
                deliveredTo = header.value;
            } else if (key == "From".toUpperCase()) {
                from = header.value;
            } else if (key == 'Subject'.toUpperCase()) {
                subject = header.value;
            } else if (key == "Date".toUpperCase()) {
                date = header.value;
            } else if (key == "Message-ID".toUpperCase()) {
                messageId = header.value;
            }
        });
        if (subject == '') {
            subject = 'no subject'
        }
        var id = message.id
        let mimeType = message.payload.mimeType;
        if (message.payload.mimeType == "text/html") {
            body = null;
            message = null;
        } else if (message.payload.mimeType == "multipart/alternative") {
            message.payload.parts.forEach(element => {
                if (element.mimeType == "text/plain") {
                    body = element.body.data;
                }
            });
        }
        return {
            "id": id,
            "deliveredTo": deliveredTo,
            "from": from,
            "subject": subject,
            "date": date,
            "messageId": messageId,
            "body": body,
            "mimeType": mimeType
        }
    }
}




module.exports = Operations 