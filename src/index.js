import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';

const app = new Hono();

const getPrisma = (database_url) => {
	const prisma = new PrismaClient({
		datasourceUrl: database_url,
	}).$extends(withAccelerate());
	return prisma;
};

// define routes
app.get('/', (c) => c.html('Hello world from hono!'));
app.get('/hello/:name', (c) => {
	const name = c.req.param('name');
	return c.text(`Hello, ${name}!`);
});

app.post('/user', async (c) => {
	const prisma = getPrisma(c.env.DATABASE_URL);

	try {
		const body = await c.req.json();

		// insert into Prisma User schema
		const newUser = await prisma.users.create({
			data: {
				username: body.username,
				password: body.password,
			},
		});

		return c.json({ message: 'User created successfully!', user: newUser });
	} catch (error) {
		console.error('Error creating user:', error);
		return c.json({ message: 'Failed to create user', error: error.message }, 500);
	}
});

// clean up Prisma client when the worker terminates
app.onError((err, c) => {
	console.error('Unexpected error:', err);
	return c.json({ message: 'Internal Server Error', error: err.message }, 500);
});

// export the Hono app as the default export
export default app;
