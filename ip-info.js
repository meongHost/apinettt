export default function (req) {
    return {
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        kota: "Unknown",
        daerah: "Unknown",
        operator: "Unknown"
    };
}
