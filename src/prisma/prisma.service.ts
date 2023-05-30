import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
	
	/**
	 * PrismaServie constructor
	 * 
	 * @param config - dùng để lấy dữ liệu từ file .env
	 */
	constructor(
		config: ConfigService
	) {
		super({
			datasources: {
				db: {
					url: config.get('DATABASE_URL'),
				},
			},
		});
	}
	cleanDb() {
		return this.$transaction([
			this.user.deleteMany()
		]);
	}
}
