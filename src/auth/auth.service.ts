import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService)) private userService: UsersService,
    private jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new NotFoundException(`user not found with: ${email}`);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    this.eventEmitter.emit('user.events', {
      userId: user.id,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          text: `User with id ${user.id} has logged in`,
        },
      ],
    });
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
    };
  }
  async validateToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
  }
}
