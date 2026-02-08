export const now = () => new Date().toISOString();

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const timeFormatDraft =  function (dateString: string) {
    const date = new Date(dateString.replace(" ", "T")); 
    console.log(date, dateString);
    
    // "2025-11-04 15:01" → "2025-11-04T15:01"

    const optionsTanggal: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    };

    const optionsWaktu: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
    };

    const tanggal = new Intl.DateTimeFormat("id-ID", optionsTanggal).format(date);
    const waktu = new Intl.DateTimeFormat("id-ID", optionsWaktu).format(date);

    return `${capitalize(tanggal)} - pukul ${waktu}`;
}

export const timeFormatStatusUpdate = function (dateString: string) {
    const date = new Date(dateString.replace(" ", "T"));

    const pad = (n: any) => String(n).padStart(2, "0");

    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${month}/${day}/${year} ${hours}:${minutes}`;
}

export function toDateTimeSeconds(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-") + " " +
    [
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
    ].join(":");
}

// const formatTimeIndication = function (text) {
//     moment.locale('id')
//     const cleaned = text.replace(/^\w+,\s*/, '')

//     const m = moment(
//         cleaned,
//         'D MMMM YYYY - [pukul] HH.mm',
//         'id',
//         true
//     )

//     if (!m.isValid()) return ''

//     return m.format('MM/DD/YYYY HH:mm')
// }