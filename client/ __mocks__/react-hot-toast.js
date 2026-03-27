const toast = jest.fn();
toast.success = jest.fn();
toast.error = jest.fn();
toast.loading = jest.fn();
toast.dismiss = jest.fn();
toast.custom = jest.fn();
toast.remove = jest.fn();

export default toast;
export { toast };
