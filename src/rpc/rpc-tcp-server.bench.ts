/*
 * Deepkit Framework
 * Copyright (C) 2021 Deepkit UG, Marc J. Schmidt
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * You should have received a copy of the MIT License along with this program.
 */

import { rpc, RpcClient, RpcKernel } from '@deepkit/rpc';
import { RpcTcpClientAdapter, RpcTcpServer } from '@deepkit/rpc-tcp';
import { BenchSuite } from '../bench';

export async function main() {
    interface ControllerInterface {
        sayHello(value: string): string;
    }

    let called = 0;

    class Controller implements ControllerInterface {
        @(rpc as any).action()
        sayHello(value: string): string {
            called++;
            return 'Hello ' + value;
        }
    }
    const kernel = new RpcKernel();
    kernel.registerController(Controller, 'myController');
    const server = new RpcTcpServer(kernel, 'localhost:55554');
    server.start();

    const client = new RpcClient(new RpcTcpClientAdapter('localhost:55554'));
    const controller = client.controller<ControllerInterface>('myController');

    const bench = new BenchSuite('controller', 2);
    const res = await controller.sayHello('foo');
    console.log(res);

    bench.addAsync('ping', async () => {
        await client.ping();
    });

    bench.addAsync('action', async () => {
        const res = await controller.sayHello('foo');
    });

    await bench.runAsync();
    client.disconnect();
    server.close();
}
