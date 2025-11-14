// services/program.service.ts
import api from "@/lib/api";

export const fetchPrograms = async (): Promise<any[]> => {
  try {
    // tell axios we expect an array (change any -> Program when you have types)
    const resp = await api.get<any[]>("/programs");
    return resp.data;
  } catch (err: any) {
    // Build a debug object with everything we can get
    const debug = {
      message: err?.message,
      isAxiosError: !!err?.isAxiosError,
      status: err?.response?.status,
      responseData: err?.response?.data,
      requestUrl: err?.config?.url ?? api.defaults.baseURL + "/programs",
    };
    // Console for developer
    console.error("fetchPrograms axios error (detailed):", debug);
    // Throw a richer error so UI can display useful info
    const thrown = new Error(
      `fetchPrograms failed: ${debug.message} (status: ${debug.status})`
    );
    // attach debug info to thrown error
    (thrown as any).debug = debug;
    throw thrown;
  }
};
