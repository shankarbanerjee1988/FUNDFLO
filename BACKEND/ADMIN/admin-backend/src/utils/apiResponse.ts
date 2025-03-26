export const apiResponse = (status: boolean, message: string, data: any = null) => {
    return { status, message, data };
  };