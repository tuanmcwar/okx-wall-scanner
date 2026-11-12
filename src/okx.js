
import axios from "axios";
import { config } from "./config.js";

const http = axios.create({
  baseURL: config.rest,
  timeout: 20000
});

async function okxGet(path, params = {}) {
  const { data } = await http.get(path, { params });

  if (data?.code !== "0") {
    throw new Error(
      `OKX ${data?.code}: ${data?.msg || "Unknown error"}`
    );
  }

  return data.data || [];
}

export async function getInstruments() {
  const instruments = await okxGet(
    "/api/v5/public/instruments",
    { instType: "SWAP" }
  );

  console.log(
    `[OKX] API trả về ${instruments.length} hợp đồng SWAP`
  );

  const filtered = instruments.filter((x) => {
    return (
      x.instType === "SWAP" &&
      x.state === "live" &&
      x.ctType === "linear" &&
      x.settleCcy === "USDT" &&
      x.instId.endsWith("-USDT-SWAP") &&
      Number(x.ctVal) > 0
    );
  });

  filtered.sort((a, b) =>
    a.instId.localeCompare(b.instId)
  );

  console.log(
    `[OKX] Tìm thấy ${filtered.length} hợp đồng USDT SWAP`
  );

  if (filtered.length === 0) {
    console.log(
      "[OKX] Mẫu hợp đồng đầu tiên:",
      JSON.stringify(instruments[0] || null, null, 2)
    );

    throw new Error(
      "Không tìm thấy hợp đồng USDT SWAP. Kiểm tra dữ liệu API."
    );
  }

  return filtered;
}

export async function getDepth(instId) {
  const result = await okxGet(
    "/api/v5/market/books",
    {
      instId,
      sz: config.depthLimit
    }
  );

  if (!result?.[0]) {
    throw new Error(`Empty order book: ${instId}`);
  }

  return result[0];
}
