import { UserModel, IUser } from "../models/user.model";

export interface PaginatedUsers {
    data: IUser[];
    total: number;
}

export interface IUserRepository {
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserByContactNumber(contactNumber: string): Promise<IUser | null>;
    // 5 common mandatory methods for a repository
    createUser(user: Partial<IUser>): Promise<IUser>;
    getUserById(id: string): Promise<IUser | null>;
    getAll(): Promise<IUser[]>;
    update(id: string, user: Partial<IUser>): Promise<IUser | null>;
    delete(id: string): Promise<boolean>;
    getPaginated(page: number, limit: number, search?: string): Promise<PaginatedUsers>;
}
export class UserMongoRepository implements IUserRepository {  
    async getUserById(id: string): Promise<IUser | null> {
        const found = await UserModel.findOne({ _id: id });
        return found;
    }
    async getUserByEmail(email: string): Promise<IUser | null> {
        const found = await UserModel.findOne({ email });
        return found;
    }
    async getUserByContactNumber(contactNumber: string): Promise<IUser | null> {
        const found = await UserModel.findOne({ contactNumber });
        return found;
    }
    async createUser(user: Partial<IUser>): Promise<IUser> {
        const created = await UserModel.create(user);
        return created;
    }
    async getAll(): Promise<IUser[]> {
        const found = await UserModel.find();
        return found;
    }
    async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
        const updated = await UserModel.findByIdAndUpdate(id, user, { new: true });
        return updated;
    }
    async delete(id: string): Promise<boolean> {
        const deleted = await UserModel.findByIdAndDelete(id);
        return !!deleted;
    }
    async getPaginated(page: number, limit: number, search?: string): Promise<PaginatedUsers> {
        const filter: Record<string, any> = {};
        if (search && search.trim().length > 0) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [{ fullName: regex }, { email: regex }];
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            UserModel.countDocuments(filter),
        ]);
        return { data, total };
    }
}