import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  transport: 'ws',
})
export class TestWsGateway {
  @SubscribeMessage('test')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
