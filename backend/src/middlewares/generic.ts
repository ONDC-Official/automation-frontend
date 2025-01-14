import { Request, Response, NextFunction } from "express";

function validateRequiredParams(params: string[]) {
	return (req: Request, res: Response, next: NextFunction): void => {
		const missingParams = params.filter((param) => !req.query[param]);
		if (missingParams.length > 0) {
			res.status(400).send({
				message: `${missingParams.join(", ")} ${
					missingParams.length > 1 ? "are" : "is"
				} required`,
			});
			return;
		}
		next();
	};
}

export default validateRequiredParams;
