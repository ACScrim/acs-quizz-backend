import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const Auth = (...args: string[]) => SetMetadata('auth', args);

export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
