import { Statue } from '@kuankuan/k-server';

/**
 * 表示写入操作已成功完成。
 *
 * 响应状态为 200，消息为 Done，响应标记为成功。
 */
export function doneStatue(): Statue {
	return new Statue(200, 'Done', true);
}

/**
 * 表示请求体未通过接口输入校验。
 *
 * 响应状态为 10001，消息说明具体无效字段或格式，响应标记为失败。
 */
export function invalidInputStatue(message: string): Statue {
	return new Statue(10001, message, false);
}

/**
 * 表示请求的呼号不存在任何 QSL 发件记录。
 *
 * 响应状态为 10002，消息包含未找到记录的呼号，响应标记为失败。
 */
export function qslSendNotFoundStatue(message: string): Statue {
	return new Statue(10002, message, false);
}
